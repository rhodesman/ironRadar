#!/bin/bash

# Use npm to run the modules in parallel
npm --prefix ./dashboard install &
npm --prefix ./backend-server install &

# Prevent the script from exiting immediately
wait