// Load env

// eslint-disable-next-line node/no-extraneous-require
require('dotenv').config();

export const seeds = process.env.CRUST_SEEDS as string;
export const chainAddr = process.env.CHAIN_ADDR as string;
export const port = parseInt(process.env.SERVER_PORT as string);
export const NFTListUrl = process.env.NFT_LIST_URL as string;
export const httpTimeout:number = 600000
