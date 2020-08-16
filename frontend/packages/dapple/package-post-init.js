const config = require('./config.json');
const ENVs = {
  'test': 'kovan',
  'main': 'live',
  'private': 'default',
};

Dapple.init = function init(env) {
  var predefinedEnv = ENVs[env];

  if (!predefinedEnv) {
    predefinedEnv = env;
  }

  Dapple.env = predefinedEnv;
  console.log(Dapple['maker-otc']['environments'])
  // Dapple['maker-otc']['environments'][Dapple.env] = { otc: {} }
  Dapple['maker-otc']['environments'][Dapple.env].otc.value = config.market[Dapple.env].address;
  Dapple['maker-otc']['environments'][Dapple.env].otc.blockNumber = config.market[Dapple.env].blockNumber;
  Dapple['maker-otc'].class(web3Obj, Dapple['maker-otc'].environments[Dapple.env]);
  Dapple['ds-eth-token'].class(web3Obj, Dapple['ds-eth-token'].environments[Dapple.env]);
  Dapple['token-wrapper'].class(web3Obj, Dapple['token-wrapper'].environments[Dapple.env]);

  if (env) {
    // Check if contract exists on new environment
    const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
    web3Obj.eth.getCode(contractAddress, (error, code) => {
      Session.set('contractExists', !error && typeof code === 'string' && code !== '' && code !== '0x');
    });
  }
};

const tokens = config.tokens;

// http://numeraljs.com/ for formats
const tokenSpecs = {
  'OW-MATIC': { precision: 18, format: '0,0.00[0000000000000000]' },
  WMATIC: { precision: 18, format: '0,0.00[0000000000000000]' },
  DAI: { precision: 18, format: '0,0.00[0000000000000000]' },
  MAHA: { precision: 18, format: '0,0.00[0000000000000000]' },
  ETH: { precision: 18, format: '0,0.00[0000000000000000]' },
};

Dapple.getQuoteTokens = () => ['W-MATI'];

Dapple.getBaseTokens = () => [];

Dapple.getTokens = () => ['WMATIC', 'MAHA', 'DAI', 'ETH'];

Dapple.generatePairs = () => {
  const TradingPairs = [
    {
      base: 'MAHA',
      quote: 'WMATIC',
      priority: 10,
    },
    {
      base: 'MAHA',
      quote: 'DAI',
      priority: 8,
    },
    {
      base: 'MAHA',
      quote: 'ETH',
      priority: 8,
    },
    {
      base: 'DAI',
      quote: 'ETH',
      priority: 8,
    },
  ];

  return TradingPairs;
};

Dapple.getTokenSpecs = (symbol) => {
  if (typeof (tokenSpecs[symbol]) !== 'undefined') {
    return tokenSpecs[symbol];
  }
  return tokenSpecs['WMATIC'];
};

Dapple.getTokenAddress = (symbol) => tokens[Dapple.env][symbol];

Dapple.getTokenByAddress = (address) => _.invert(tokens[Dapple.env])[address];

Dapple.getToken = (symbol, callback) => {
  if (!(Dapple.env in tokens)) {
    callback('Unknown environment', null);
    return;
  }
  if (!(symbol in tokens[Dapple.env])) {
    callback(`Unknown token "${symbol}"`, null);
    return;
  }

  const address = Dapple.getTokenAddress(symbol);
  let tokenClass = 'DSTokenBase';
  let that = Dapple['ds-eth-token'];

  if (symbol === 'WMATIC' || symbol === 'OW-MATIC') {
    tokenClass = 'DSEthToken';
  } else if (symbol === 'W-GNT') {
    tokenClass = 'TokenWrapper';
    that = Dapple['token-wrapper'];
  }

  try {
    that.classes[tokenClass].at(address, (error, token) => {
      if (!error) {
        token.abi = that.classes[tokenClass].abi;
        callback(false, token);
      } else {
        callback(error, token);
      }
    });
  } catch (e) {
    callback(e, null);
  }
};
