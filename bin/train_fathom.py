#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""
Runs automated JavaScript tests by launching Firefox in headless mode
and using the Marionette protocol to run the test code in Firefox.

This script relies on path modifications from npm and should be run
using the ``npm run test`` command.
"""

import os
from subprocess import check_call
from tempfile import mkstemp

import click
from marionette_driver.marionette import Marionette


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


@click.command()
@click.option(
    '--firefox_bin',
    required=True,
    envvar='npm_package_config_firefox_bin',
    help='Path to Firefox binary',
)
def main(firefox_bin):
    if not firefox_bin:
        raise click.BadParameter(
            'No Firefox binary found; configure the path to Firefox with `npm config`.'
        )
    elif not os.path.exists(firefox_bin):
        raise click.BadParameter('Path to Firefox binary does not exist.')

    click.echo('== Building ruleset bundle with Webpack')
    webpack_config_path = os.path.join(ROOT, 'webpack.config.ruleset.js')
    check_call([
        'webpack',
        '--bail',
        '--config', webpack_config_path,
    ])

    click.echo('== Building training bundle with Webpack')
    bundle_handle, bundle_path = mkstemp()
    try:
        webpack_config_path = os.path.join(ROOT, 'webpack.config.fathom.js')
        check_call([
            'webpack',
            '--bail',
            '--config', webpack_config_path,
            '--output', bundle_path,
        ])
        with open(bundle_path) as f:
            test_code = f.read()
    finally:
        os.remove(bundle_path)

    click.echo('== Running training')
    client = None
    try:
        client = Marionette(bin=firefox_bin, headless=True)
        client.start_session()
        results = client.execute_async_script(
            test_code,
            sandbox='system',
            script_timeout=1000 * 60 * 5,
        )
    finally:
        if client:
            client.cleanup()

    click.echo('Best Solution: {}'.format(results[0]))
    click.echo('Best Cost: {}'.format(results[1]))


if __name__ == '__main__':
    main()
