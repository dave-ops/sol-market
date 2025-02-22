#!/bin/bash

# Ensure we're in the correct directory (adjust if needed)
cd ~/sol-market/test || exit 1

# Get the Program ID from solana program show --programs
# Assuming the first Program ID listed is the one we want
PROGRAM_ID=$(solana program show --programs | grep -oE '[1-9A-HJ-NP-Za-km-z]{44}' | head -n 1)

if [ -z "$PROGRAM_ID" ]; then
    echo "Error: Could not find a Program ID. Check if the program is deployed and solana-test-validator is running."
    exit 1
fi

# Set the Program ID as an environment variable (export it for use in Node.js)
echo "export SOLANA_PROGRAM_ID=$PROGRAM_ID" > program_id.env
echo "Program ID retrieved and saved: $PROGRAM_ID"

# Source the environment file to make the variable available in the current session
source program_id.env

# Update test.js to use the environment variable
# Create a backup of test.js first
cp test.js test.js.backup

# Use sed to replace the hardcoded Program ID with the environment variable
# Look for a line like: const programId = new PublicKey('...');
# and replace it with: const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID);
sed -i "s|const programId = new PublicKey('[^']*');|const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID);|" test.js

# Verify the change
if grep -q "process.env.SOLANA_PROGRAM_ID" test.js; then
    echo "Successfully updated test.js to use environment variable SOLANA_PROGRAM_ID"
else
    echo "Warning: Failed to update test.js. Restoring backup..."
    mv test.js.backup test.js
    exit 1
fi

# Optional: Display the updated test.js content
echo "Updated test.js:"
cat test.js

# Instructions for the user
echo "To run test.js, ensure you source the environment file first:"
echo "source program_id.env"
echo "Then run: node test.js"