#!/bin/bash

# Script to open preview deployments

VERCEL_PROJECT="ovqat-ai"
VERCEL_USER="azizmadjitov"

case "$1" in
  dev|develop)
    echo "🚀 Opening Development preview..."
    URL="https://${VERCEL_PROJECT}-git-develop-${VERCEL_USER}.vercel.app"
    ;;
  staging)
    echo "🧪 Opening Staging preview..."
    URL="https://${VERCEL_PROJECT}-git-staging-${VERCEL_USER}.vercel.app"
    ;;
  prod|production|main)
    echo "✅ Opening Production..."
    URL="https://${VERCEL_PROJECT}.vercel.app"
    ;;
  *)
    echo "Usage: ./open-preview.sh [dev|staging|prod]"
    echo ""
    echo "Examples:"
    echo "  ./open-preview.sh dev      - Open development preview"
    echo "  ./open-preview.sh staging  - Open staging preview"
    echo "  ./open-preview.sh prod     - Open production"
    exit 1
    ;;
esac

echo "Opening: $URL"
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || echo "Please open manually: $URL"
