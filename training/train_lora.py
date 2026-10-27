"""Alias entry point (`train_lora.py`) forwarding to `fine_tune_lora.py` as referenced in Task 3.4."""

from fine_tune_lora import run_lora_training, DEFAULT_DATASET, DEFAULT_OUTPUT

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train LoRA adapter (r=16, alpha=32)")
    parser.add_argument("--model-id", default="Qwen/Qwen2.5-3B-Instruct")
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run_lora_training(
        model_id=args.model_id,
        dataset_path=args.dataset,
        output_dir=args.output_dir,
        epochs=args.epochs,
        dry_run=args.dry_run,
    )
