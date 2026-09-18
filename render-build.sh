#!/usr/bin/env bash
# Render Build Script — installs Node.js + Python AI dependencies
set -o errexit

echo "=== [1/4] Installing Node.js dependencies ==="
npm install

echo "=== [2/4] Installing Python 3 + pip ==="
# Render's native environment has Python 3 available
# Ensure pip is installed/upgraded
python3 -m ensurepip --upgrade 2>/dev/null || true
python3 -m pip install --upgrade pip

echo "=== [3/4] Installing AI Engine Python packages ==="
python3 -m pip install --no-cache-dir \
  torch --index-url https://download.pytorch.org/whl/cpu
python3 -m pip install --no-cache-dir \
  torchvision --index-url https://download.pytorch.org/whl/cpu
python3 -m pip install --no-cache-dir \
  transformers pillow ftfy regex
python3 -m pip install --no-cache-dir \
  git+https://github.com/openai/CLIP.git

echo "=== [4/4] Building frontend ==="
npm run build

echo "=== Build complete ==="
python3 --version
python3 -c "import torch; print(f'PyTorch {torch.__version__}')"
python3 -c "import clip; print('CLIP OK')"
python3 -c "from transformers import pipeline; print('Transformers OK')"
