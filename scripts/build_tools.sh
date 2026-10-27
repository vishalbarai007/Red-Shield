#!/usr/bin/env bash
# =============================================================================
# RedShield / Cyber-Cerberus: Diagnostic Tool Image Builder & Smoke Test
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "================================================================="
echo "  RedShield Sandbox Container Builder (Academic Safe Mode)"
echo "================================================================="

if ! command -v docker >/dev/null 2>&1; then
    echo "[!] Docker daemon/CLI is not installed or accessible in this environment."
    echo "[*] Skipping image build; backend will use built-in async diagnostic stream fallback."
    exit 0
fi

bash "${ROOT_DIR}/docker/sandbox-network.sh"

declare -A TOOLS=(
    ["redshield-tool-sqlmap:latest"]="${ROOT_DIR}/docker/tools/sqlmap"
    ["redshield-tool-xsstrike:latest"]="${ROOT_DIR}/docker/tools/xsstrike"
    ["redshield-tool-ffuf:latest"]="${ROOT_DIR}/docker/tools/ffuf"
)

for IMAGE in "${!TOOLS[@]}"; do
    CONTEXT="${TOOLS[$IMAGE]}"
    echo "[*] Building ${IMAGE} from ${CONTEXT}..."
    docker build -t "${IMAGE}" "${CONTEXT}"
    echo "[+] Built ${IMAGE} successfully."
done

echo "[*] Running non-root, read-only smoke test..."
for IMAGE in "${!TOOLS[@]}"; do
    echo " -> Smoke testing ${IMAGE}..."
    docker run --rm \
        --read-only \
        --cap-drop=ALL \
        --security-opt="no-new-privileges:true" \
        --memory="512m" \
        --cpu-quota=50000 \
        -e TARGET_URL="http://juice-shop.local/test" \
        "${IMAGE}" | head -n 4
done

echo "[+] All sandbox diagnostic images built and verified!"
