#!/usr/bin/env sh

# postinstall debug: print environment and some package files to help CI debugging
echo "--- POSTINSTALL DEBUG START ---"
node --version || true
npm --version || true
echo "PWD: $(pwd)"
echo "---- root package.json ----"
cat package.json || true
echo "---- telegram-bot package.json ----"
cat telegram-bot/package.json || true
echo "---- root package-lock.json (first 200 lines) ----"
head -n 200 package-lock.json || true
echo "---- telegram-bot package-lock.json (first 200 lines) ----"
head -n 200 telegram-bot/package-lock.json || true
echo "--- POSTINSTALL DEBUG END ---"
