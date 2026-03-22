#!/usr/bin/env python3
"""
EcoCart Development Runner
--------------------------
Run the FastAPI server in development mode with hot-reload.

Usage:
    python run.py                    # Default (port 8000)
    python run.py --port 8080        # Custom port
    python run.py --host 0.0.0.0    # Public host
    python run.py --no-reload        # Disable hot-reload
"""

import argparse
import os
import sys

import uvicorn


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="EcoCart API Development Runner")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--no-reload", action="store_true", help="Disable hot-reload")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--log-level", default="info", help="Log level (default: info)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Ensure .env is loaded
    if not os.path.exists(".env"):
        print("⚠️  Warning: .env file not found. Copying from .env.example...")
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("✅ .env created from .env.example — please fill in your values!")
        else:
            print("❌ .env.example not found either. You may encounter configuration errors.")

    reload = not args.no_reload
    if args.workers > 1 and reload:
        print("⚠️  Hot-reload is disabled when using multiple workers.")
        reload = False

    print(f"""
╔══════════════════════════════════════════════╗
║         🌿 EcoCart API Server                ║
║──────────────────────────────────────────────║
║  Host:    http://{args.host}:{args.port}
║  Docs:    http://{args.host}:{args.port}/docs
║  Redoc:   http://{args.host}:{args.port}/redoc
║  Reload:  {'✅ Enabled' if reload else '❌ Disabled'}
╚══════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=reload,
        workers=args.workers if not reload else 1,
        log_level=args.log_level,
        access_log=True,
    )


if __name__ == "__main__":
    main()
