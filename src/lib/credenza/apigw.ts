import {Buffer} from 'buffer';

type TValidateRulessetOptions = {
  chainId: string,
  clientId: string
  clientSecret: string
  rulesetId: string
  scanned: string
}

const assembleBasicAuthToken = (clientId: string, clientSecret:string) => {
  return `Basic ${Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64')}`
}

const getApiUrl = (chainId:string | undefined) => {
  const API_URL = {
    TESTNETS: 'https://api.testnets.credenza.online',
    MAINNETS: 'https://api.credenza.online',
  }
  switch (chainId) {
    case '137': return API_URL.MAINNETS;
    case '80001': return API_URL.TESTNETS;
    default: throw new Error('Unsupported chainId: ' + chainId)
  }
}

export const validateRulesetWithApi = async (opts: TValidateRulessetOptions) => {
  const apiUrl = getApiUrl(opts.chainId)
  const result = await fetch(`${apiUrl}/discounts/rulesets/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: assembleBasicAuthToken(opts.clientId, opts.clientSecret)
    },
    body: JSON.stringify({
      ruleSetId: opts.rulesetId,
      passportId: opts.scanned
    })
  })
  if (!result.ok) return;
  return await result.json()
}

const getWsUrl = (chainId:string | undefined) => {
  const WS_URL = {
    TESTNETS: 'wss://ws.testnets.credenza.online',
    MAINNETS: 'wss://ws.credenza.online',
  }
  switch (chainId) {
    case '137': return WS_URL.MAINNETS;
    case '80001': return WS_URL.TESTNETS;
    default: throw new Error('Unsupported chainId: ' + chainId)
  }
}

const openWsConnection = async (wsUrl:string): Promise<WebSocket> => {
  return new Promise((resolve) => {
    const socket = new WebSocket(wsUrl)
    socket.addEventListener('open', () => resolve(socket))
  })
}

export const validateRulesetWithWs = async (opts: TValidateRulessetOptions) => {
  const wsUrl = getWsUrl(opts.chainId);
  const socket = await openWsConnection(wsUrl)

  const requestData = {
    action: 'validateDiscountRuleset',
    credenzaRequestId: new Date().getTime(),
    authorization: assembleBasicAuthToken(opts.clientId, opts.clientSecret),
    body: {
      ruleSetId: opts.rulesetId,
      passportId: opts.scanned
    }
  }

  return new Promise((resolve, reject) => {
    socket.addEventListener('error', (err) => reject(err))
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event?.data || '{}')
        if (data.credenzaRequestId !== requestData.credenzaRequestId) return
        socket.close()
        console.log(data.body)
        resolve(data.body)
      } catch (err) {
        socket.close()
        reject(err)
      }
    })
    socket.send(JSON.stringify(requestData))
  })
}