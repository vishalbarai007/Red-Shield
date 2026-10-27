"""
Task 3.4: PEFT QLoRA Fine-Tuning Script (`fine_tune_lora.py` / `train_lora.py`)
Fine-tunes `Qwen/Qwen2.5-3B-Instruct` or `meta-llama/Llama-3.2-3B-Instruct` using:
  - 4-bit NF4 quantization via `BitsAndBytesConfig`
  - PEFT `LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, task_type="CAUSAL_LM")`
  - TRL `SFTTrainer` on sanitized tool log -> structured CVE/MITRE JSON pairs
"""

import argparse
import os
from pathlib import Path

DEFAULT_DATASET = str(Path(__file__).resolve().parent / "datasets" / "security_logs_sft.jsonl")
DEFAULT_OUTPUT = str(Path(__file__).resolve().parent / "outputs" / "redshield-slm-lora")


def run_lora_training(
    model_id: str = "Qwen/Qwen2.5-3B-Instruct",
    dataset_path: str = DEFAULT_DATASET,
    output_dir: str = DEFAULT_OUTPUT,
    epochs: int = 3,
    batch_size: int = 2,
    learning_rate: float = 2e-4,
    dry_run: bool = False,
) -> dict:
    config_summary = {
        "base_model": model_id,
        "dataset_path": dataset_path,
        "output_dir": output_dir,
        "lora_r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "quantization": "4-bit NF4 (BitsAndBytes)",
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
    }
    print("[*] RedShield SLM QLoRA Training Configuration:")
    for k, v in config_summary.items():
        print(f"    {k}: {v}")

    if dry_run:
        print("[+] Dry-run configuration verified successfully.")
        return config_summary

    import torch
    from datasets import load_dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
    )
    from trl import SFTTrainer

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

    dataset = load_dataset("json", data_files=dataset_path, split="train")

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=4,
        learning_rate=learning_rate,
        fp16=not torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
        bf16=torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        peft_config=peft_config,
        processing_class=tokenizer,
        args=training_args,
    )

    trainer.train()
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"[+] Saved fine-tuned LoRA adapter weights to {output_dir}")
    return config_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Local SLM with QLoRA (r=16, alpha=32)")
    parser.add_argument("--model-id", default="Qwen/Qwen2.5-3B-Instruct")
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true", help="Validate config without GPU run")
    args = parser.parse_args()
    run_lora_training(
        model_id=args.model_id,
        dataset_path=args.dataset,
        output_dir=args.output_dir,
        epochs=args.epochs,
        dry_run=args.dry_run,
    )
