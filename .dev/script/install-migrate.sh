#!/bin/bash

FORCED=false
VERBOSE=false

while getopts ":fv" opt; do
    case $opt in
        f) FORCED=true;;
        v) VERBOSE=true;;
    esac
done

if ! command -v migrate &> /dev/null; then
    if [ "$FORCED" = true ]; then
        install_golang_migrate
    else
        echo "❌ Error: 'migrate' is not installed."
        echo ""
        echo "🤔 Would you like to install 'golang-migrate'? (y/n)"
        read -r response

        if [[ "$response" =~ ^[Yy]$ ]]; then
            install_golang_migrate
        else
            echo "⏸️ Installation cancelled. To install 'migrate' later, run:"
            echo "  go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest"
            exit 1
        fi
    fi
else
    if [ "$VERBOSE" = true ]; then
        echo "✅ 'migrate' is already installed."
    fi
fi

install_golang_migrate() {
    echo "🔧 Installing 'golang-migrate'..."
    go install -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

    if [ $? -eq 0 ]; then
        echo "✅ 'migrate' installed successfully!"
    else
        echo "❌ Failed to install 'migrate'. Please try installing manually:"
        echo "  go install -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"
        exit 1
    fi
}
