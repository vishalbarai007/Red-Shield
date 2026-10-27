#!/usr/bin/env bash
# =============================================================================
# Red-Shield: Isolated Sandbox Network Setup
# =============================================================================
set -euo pipefail

NETWORK_NAME="redshield_sandbox_net"
SUBNET="172.28.0.0/16"

echo "[*] Configuring isolated Docker bridge network: ${NETWORK_NAME} (${SUBNET})..."

if ! command -v docker >/dev/null 2>&1; then
    echo "[!] Docker CLI not detected. Sandbox service will run in safe local async simulation mode."
    exit 0
fi

if docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
    echo "[+] Network '${NETWORK_NAME}' already exists."
else
    docker network create \
        --driver bridge \
        --subnet "${SUBNET}" \
        --opt com.docker.network.bridge.enable_icc=false \
        "${NETWORK_NAME}"
    echo "[+] Created isolated bridge network '${NETWORK_NAME}' with Inter-Container Communication (ICC) disabled."
fi
