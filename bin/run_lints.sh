#!/bin/bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Runs linting.

set -e

# Run flake8 to lint Python tests
echo ">>> eslint"
eslint .

echo ">>> web-ext lints"
web-ext lint --self-hosted --source-dir build
