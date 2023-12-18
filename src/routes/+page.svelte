<script lang="ts">
	import { Scanner } from '@credenza-web3/scanner';
	import { onMount } from 'svelte';
	import { validateRulesetWithApi, validateRulesetWithWs } from '$lib/credenza/apigw';

	type TScannerResult = {
		chainId?: string;
		scanType?: string;
		userAddress?: string;
		rawString: string;
		message: string;
	};

	const SCANNER_ELEMENT_ID = 'ScannerBlock';

	let scanner: typeof Scanner;
	let clientId: string = '';
	let clientSecret: string = '';
	let rulesetId: string = '';
	let isLoading: boolean = false;
	let isUseWebsocket = false;

	$: {
		if (scanner && isLoading === true) {
			scanner.close();
		}
	}

	const checkRuleset = async (data: TScannerResult) => {
		if (data.scanType !== 'PASSPORT_ID' || !data.chainId) return;
		isLoading = true;

		try {
			const requestData = {
				chainId: data.chainId,
				clientId,
				clientSecret,
				rulesetId,
				scanned: data.rawString
			};

			const json = isUseWebsocket
				? await validateRulesetWithWs(requestData)
				: await validateRulesetWithApi(requestData);
			isLoading = false;
			const requestType = isUseWebsocket ? 'Credenza Websocket' : 'Credenza REST API';
			alert(
				`User Address: ${json.userAddress}\nCode: ${json.discount?.code}\nRate: ${json.discount?.rate}\nWith: ${requestType}`
			);
		} catch (err) {
			console.error(err);
			isLoading = false;
		}
	};

	const openScanner = () => {
		if (!clientId || !clientSecret || !rulesetId) return alert('Please fill all *required fields');
		scanner.scan();
	};

	onMount(() => {
		scanner = new Scanner({ target: '#' + SCANNER_ELEMENT_ID });
		scanner.on(Scanner.events.CAPTURE, checkRuleset);
	});
</script>

<main class="p-4">
	<label
		class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
		for="sUseWebsocket"
	>
		Use Websocket?:
	</label>
	<input
		bind:checked={isUseWebsocket}
		id="isUseWebsocket"
		type="checkbox"
		placeholder="ClientId e.g. 64e32655965e6a076076a935"
	/>

	<label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="clientId">
		*Client Id:
	</label>
	<input
		bind:value={clientId}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="clientId"
		type="text"
		placeholder="Client id. e.g. 64e32655965e6a076076a935"
	/>

	<label
		class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
		for="clientSecret"
	>
		*Client Secret:
	</label>
	<input
		bind:value={clientSecret}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="clientSecret"
		type="password"
		placeholder="Client secret. e.g. 9a4a645b09b68da197827fbb14e93ecf"
	/>

	<label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="rulesetId">
		*Ruleset Id:
	</label>
	<input
		bind:value={rulesetId}
		class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		id="rulesetId"
		type="text"
		placeholder="Ruleset id. e.g. 542c2b97bac0595474108b48"
	/>
	<button class="bg-blue-500 py-2 px-4 text-white" on:click|preventDefault={openScanner}>
		Open scanner
	</button>
	{#if isLoading}
		<div class="text-center">Loading...</div>
	{/if}

	<div class="w-full flex justify-center">
		<div id={SCANNER_ELEMENT_ID} class="w-[375px] h-[375px]" />
	</div>
</main>
