#!/bin/bash

ROOT_DIR=$(pwd)

function bold () {
  echo "\033[1m$1\033[m"
}

function black_on_white() {
  echo "\033[7m $1 \033[0m"
}

function throw () {
  if [[ -z "$1" ]]; then
    exit 1
  fi
  echo "$(bold "Error: $1")"
  exit 1
}

function relative () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: relative <path>"
  fi
  (cd "$1" && pwd) | sed "s|^$ROOT_DIR/||"
}

function prompt_continue () {
  read -p "$(bold "Continue?") (y/n) " cont
  if [[ "$cont" != "y" ]]; then
    echo $(bold "Bye.")
    exit 0
  else 
    echo "\n"
  fi
}

function git_status () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_status <path>"
  fi
  echo "$(bold "$(black_on_white "Checking git status in $(relative "$1")...")")"
  echo "\n"
  prompt_continue
  cd $1
  git status
  echo "\n"
}

function git_log () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_status <path>"
  fi
  echo "$(bold "$(black_on_white "Logging git history in $(relative "$1")...")")"
  echo "\n"
  cd $1
  git log
  echo "\n"
}

function git_pull_master () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_pull_master <path>"
  fi
  echo "$(bold "$(black_on_white "Pulling origin/master in $(relative "$1")...")")"
  echo "\n"
  prompt_continue
  cd $1
  git pull origin master
  echo "\n"
}

function git_push_master () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_push_master <path>"
  fi
  echo "$(bold "$(black_on_white "Pushing origin/master in $(relative "$1")...")")"
  echo "\n"
  prompt_continue
  cd $1
  git push origin master
  echo "\n"
}

function git_fetch_upstream_master () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_fetch_upstream_master <path>"
  fi
  echo "$(bold "$(black_on_white "Fetching upstream/master in $(relative "$1")...")")"
  echo "\n"
  prompt_continue
  cd $1
  git fetch upstream master
  echo "\n"
}

function git_merge_upstream_master () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: git_merge_upstream_master <path>"
  fi
  echo "$(bold "$(black_on_white "Merging upstream/master in $(relative "$1")..")")"
  echo "\n"
  prompt_continue
  cd $1
  git merge upstream/master
  echo "\n"
}

function npm_install () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: npm_instann <path>"
  fi
  echo "$(bold "$(black_on_white "Installing NPM dependencies in $(relative "$1")..")")"
  echo "\n"
  prompt_continue
  cd $1
  npm install
  echo "\n"
  if [[ -n "$2" ]]; then
    echo "installing $2"
    npm install "$2"
    echo "\n"
  fi
}

function build () {
  if [[ -z "$1" || -z "$2" ]]; then
    throw "Missing arguments. Usage: build <path> <build_command>"
  fi
  echo "$(bold "$(black_on_white "Building $(relative "$1")..")")"
  echo "\n"
  prompt_continue
  cd $1
  npm run $2
  echo "\n"
}

function publish () {
  if [[ -z "$1" ]]; then
    throw "Missing arguments. Usage: npm_instann <path>"
  fi
  cd $1
  read -p "$(bold "$(black_on_white "Do you want to publish to NPM ?")") (y/n) " cont
  echo "\n"
  if [[ "$cont" == "y" ]]; then
    read -p "Enter OTP : " otp
    if [[ "$otp" == "-" ]]; then
    echo "\n"
      return
    fi
    if [[ ${#otp} -eq 6 ]]; then
      OTP=$otp npm publish
      git_push_master "$1"
      echo "\n"
    else
      throw "Invalid OTP. OTP must be 6 characters long."
    fi
  fi
}

# INIT
echo "\n"

# LM TOOLS
git_status "$ROOT_DIR/le-monde/lm-tools"
git_pull_master "$ROOT_DIR/le-monde/lm-tools"
npm_install "$ROOT_DIR/le-monde/lm-tools"
build "$ROOT_DIR/le-monde/lm-tools" "build:src"
publish "$ROOT_DIR/le-monde/lm-tools"

# LM CLI
git_status "$ROOT_DIR/le-monde/lm-cli"
git_pull_master "$ROOT_DIR/le-monde/lm-cli"
npm_install "$ROOT_DIR/le-monde/lm-cli" "@design-edito/tools@latest"
build "$ROOT_DIR/le-monde/lm-cli" "build:src"
publish "$ROOT_DIR/le-monde/lm-cli"

# MXFB TOOLS
git_status "$ROOT_DIR/maximefabas/tools"
git_pull_master "$ROOT_DIR/maximefabas/tools"
git_fetch_upstream_master "$ROOT_DIR/maximefabas/tools"
git_merge_upstream_master "$ROOT_DIR/maximefabas/tools"
git_status "$ROOT_DIR/maximefabas/tools"
git_push_master "$ROOT_DIR/maximefabas/tools"
npm_install "$ROOT_DIR/maximefabas/tools"
build "$ROOT_DIR/maximefabas/tools" "build:src"
publish "$ROOT_DIR/maximefabas/tools"

# MXFB CLI
git_status "$ROOT_DIR/maximefabas/cli"
git_pull_master "$ROOT_DIR/maximefabas/cli"
git_fetch_upstream_master "$ROOT_DIR/maximefabas/cli"
git_merge_upstream_master "$ROOT_DIR/maximefabas/cli"
git_status "$ROOT_DIR/maximefabas/cli"
git_push_master "$ROOT_DIR/maximefabas/cli"
npm_install "$ROOT_DIR/maximefabas/cli" "@mxfb/tools@latest"
build "$ROOT_DIR/maximefabas/cli" "build:src"
publish "$ROOT_DIR/maximefabas/cli"

# END
echo "$(bold "Everything done. Bye.")\n"
