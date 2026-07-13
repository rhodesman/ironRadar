#!/bin/bash

# Use npm to run the modules in parallel
npm --prefix ./dashboard start &
npm --prefix ./backend-server start &

# Prevent the script from exiting immediately
wait

