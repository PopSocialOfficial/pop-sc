# Instruction for setting up Vesting


1. Go to the squid indexer, run it for token sale address (for each sale)
2. Log into the PostgreSQL database and export tables for deposits into a CSV (for each sale)
3. Add the CSV in scripts folder (for each sale)
4. Go to getAmountsOwed.ts file and run it, it will generate a CSV with recipient - amountOwed (for each sale)
5. Go to setupVesting.ts and run it, it will read the amounts and recipient and it will construct all parameters for initializing the vesting contract (for each sale)

Note: There are 2 sale contracts and 2 vesting contracts, one for each.