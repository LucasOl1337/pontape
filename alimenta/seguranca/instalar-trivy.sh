#!/usr/bin/env bash
# Instala o Trivy por binário de versão FIXA conferindo o sha256 publicado.
# Nunca por tag móvel nem pela trivy-action: em 19/03/2026 a cadeia do Trivy
# foi comprometida (GHSA-69fq-xp46-6x23). Uso: instalar-trivy.sh DESTINO
set -euo pipefail
VERSION="0.76.0"
SHA256="e24b1c51293c1b15e4ba8d45bbc7891ba053f90278ec2698f3562c993e145fe7"  # trivy_0.76.0_Linux-64bit.tar.gz
DEST="${1:-$HOME/.local/bin}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -sSLf -o "$TMP/trivy.tgz" \
  "https://github.com/aquasecurity/trivy/releases/download/v${VERSION}/trivy_${VERSION}_Linux-64bit.tar.gz"
echo "${SHA256}  $TMP/trivy.tgz" | sha256sum -c -
mkdir -p "$DEST"
tar -xzf "$TMP/trivy.tgz" -C "$TMP" trivy
install -m 0755 "$TMP/trivy" "$DEST/trivy"
"$DEST/trivy" --version
