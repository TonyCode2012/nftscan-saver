import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { HttpGetRes } from '../types/types';
import { chainAddr, httpTimeout } from '../consts';
import https from 'https';

/* PUBLIC METHODS */
/**
 * sleep
 * @param {number} microsec 
 * @returns promise
 */
export function sleep(microsec: number) {
  return new Promise(resolve => setTimeout(resolve, microsec))
}

/**
 * sleep
 * @param {string} url 
 * @returns promise
 */
export function httpGet(url: string): Promise<HttpGetRes> {
  return new Promise((resolve, reject) => {
    https.get(url, {timeout: httpTimeout}, function(res: any) {
      const { statusCode } = res
      let tmpData: string = ''
      if (statusCode === 200 ) {
        res.on('data', (d: string) => {
          tmpData += d
        })
        res.on('end', () => {
          resolve({
            status: true,
            data: tmpData
          })
        })
      } else {
        reject({ 
          status: false,
        })
      }
    }).on('error', (e: any) => {
      reject({ 
        status: false,
      })
    })
  });
}

/**
 * Check CIDv0 legality
 * @param {string} cid 
 * @returns boolean
 */
export function checkCid(cid: string) {
  return cid.length === 46 && cid.substr(0, 2) === 'Qm';
}

export function parsObj(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check seeds(12 words) legality
 * @param {string} seeds 
 * @returns boolean
 */
export function checkSeeds(seeds: string) {
  return seeds.split(' ').length === 12;
}

/**
 * Send tx to Crust Network
 * @param {import('@polkadot/api/types').SubmittableExtrinsic} tx
 * @param {string} seeds 12 secret words 
 * @returns Promise<boolean> send tx success or failed
 */
export async function sendTx(tx: SubmittableExtrinsic, seeds: string) {
  // 1. Load keyring
  console.log('⛓  Sending tx to chain...');
  const krp = loadKeyringPair(seeds);
    
  // 2. Send tx to chain
  return new Promise((resolve, reject) => {
    tx.signAndSend(krp, ({events = [], status}) => {
          console.log(
              `  ↪ 💸  Transaction status: ${status.type}, nonce: ${tx.nonce}`
          );

          if (
              status.isInvalid ||
              status.isDropped ||
              status.isUsurped ||
              status.isRetracted
          ) {
              reject(new Error('Invalid transaction'));
          } else {
              // Pass it
          }

          if (status.isInBlock) {
              events.forEach(({event: {method, section}}) => {
              if (section === 'system' && method === 'ExtrinsicFailed') {
                  // Error with no detail, just return error
                  console.error('  ↪ ❌  Send transaction failed');
                  resolve(false);
              } else if (method === 'ExtrinsicSuccess') {
                  console.log('  ↪ ✅  Send transaction success.');
                  resolve(true);
              }
              });
          } else {
              // Pass it
          }
      }).catch((e: any) => {
          reject(e);
      });
  });
}

export async function checkReplica(cid: string) {
  let fileReplica = 0
  // Check cid
  if (!checkCid(cid)) {
    throw new Error('Illegal inputs');
  }

  // Try to connect to Crust Chain
  const chain = new ApiPromise({
    provider: new WsProvider(chainAddr),
    typesBundle: typesBundleForPolkadot
  });

  await chain.isReadyOrError;

  const file = parsObj(await chain.query.market.files(cid));

  if (file) {
    fileReplica = file.reported_replica_count
  } else {
    console.error('File not found or no replicas')
  }

  await chain.disconnect();

  return fileReplica
}

/* PRIVATE METHODS  */
/**
 * Load keyring pair with seeds
 * @param {string} seeds 
 */
function loadKeyringPair(seeds: string) {
  const kr = new Keyring({
      type: 'sr25519',
  });

  const krp = kr.addFromUri(seeds);
  return krp;
}
