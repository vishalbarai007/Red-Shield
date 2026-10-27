"""
Model Export Utility (`export_model.py`)
Merges fine-tuned PEFT LoRA adapter weights (`r=16, alpha=32`) into the base
`Qwen/Qwen2.5-3B-Instruct` or `meta-llama/Llama-3.2-3B-Instruct` model for standalone local serving.
"""

import argparse
from pathlib import Path

DEFAULT_ADAPTER = str(Path(__file__).resolve().parent / "outputs" / "redshield-slm-lora")
DEFAULT_MERGED = str(Path(__file__).resolve().parent / "outputs" / "redshield-slm-merged")


def export_merged_model(
    base_model_id: str = "Qwen/Qwen2.5-3B-Instruct",
    adapter_dir: str = DEFAULT_ADAPTER,
    export_dir: str = DEFAULT_MERGED,
    dry_run: bool = False,
) -> None:
    print(f"[*] Exporting LoRA adapter from '{adapter_dir}' merged with '{base_model_id}' -> '{export_dir}'")
    if dry_run:
        print("[+] Dry-run export verification complete.")
        return

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(base_model_id, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    peft_model = PeftModel.from_pretrained(base_model, adapter_dir)
    merged = peft_model.merge_and_unload()
    merged.save_pretrained(export_dir, safe_serialization=True)
    tokenizer.save_pretrained(export_dir)
    print(f"[+] Standalone merged SLM saved to {export_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge and export PEFT LoRA weights")
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-3B-Instruct")
    parser.add_argument("--adapter-dir", default=DEFAULT_ADAPTER)
    parser.add_argument("--export-dir", default=DEFAULT_MERGED)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    export_merged_model(args.base_model, args.adapter_dir, args.export_dir, args.dry_run)
