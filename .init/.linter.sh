#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-fullstack-calculator-92910-92920/calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

