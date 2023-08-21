<script lang="ts">
	import { Scanner } from '@credenza-web3/scanner';
  import {Buffer} from 'buffer';
  import type {} from '@credenza-web3/scanner/dist/Scanner.types';
	import { onMount } from 'svelte';

  type TScannerResult = {
    chainId?: string;
    scanType?: string;
    userAddress?: string;
    rawString: string;
    message: string;
  }

	const SCANNER_ELEMENT_ID = 'ScannerBlock';

	let clientId: string = ''
	let clientSecret: string = ''
  let rulesetId:string = ''
  let isLoading: boolean

  $: {
    if (scanner && isLoading === true) {
      scanner.close()
    } else if (scanner && isLoading === false) {
      scanner.scan()
    }
  }

	let scanner: Scanner;

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

  const checkRuleset = async (data:TScannerResult) => {
    if (!clientId || !clientSecret || !rulesetId || data.scanType !== 'PASSPORT_ID') return;

    isLoading = true
  
    try {
      const apiUrl = getApiUrl(data.chainId)
      const result = await fetch(`${apiUrl}/discounts/rulesets/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64')}`
        },
        body: JSON.stringify({
          ruleSetId: rulesetId,
          passportId: data.rawString
        })
      })
      if (!result.ok) return;
      const json = await result.json()
      alert(`Address: ${json.address}\nCode: ${json.code}`)
    } catch (_err) {}
    isLoading = false
  }

	onMount(() => {
		scanner = new Scanner({ target: '#' + SCANNER_ELEMENT_ID });
    scanner.on(Scanner.events.CAPTURE, checkRuleset);
    isLoading = false
	});
</script>

<main class="p-4">
	<label
		class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
		for="clientId"
	>
		Client Id:
	</label>
	<input
    bind:value={clientId}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="clientId"
		type="text"
		placeholder="64e32655965e6a076076a935"
	/>

	<label
		class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
		for="clientSecret"
	>
		Client Secret:
	</label>
	<input
    bind:value={clientSecret}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="clientSecret"
		type="password"
		placeholder="9a4a645b09b68da197827fbb14e93ecf"
	/>

  <label
		class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
		for="rulesetId"
	>
		Ruleset Id:
	</label>
	<input
    bind:value={rulesetId}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="rulesetId"
		type="text"
		placeholder="542c2b97bac0595474108b48"
	/>
  {#if isLoading}
    <div class="text-center">Loading...</div>
  {/if}

  <div class="w-full flex justify-center">
	  <div id={SCANNER_ELEMENT_ID} class="w-[375px] h-[375px]" />
  </div>
  
</main>


