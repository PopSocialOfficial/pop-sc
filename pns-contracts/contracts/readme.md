```bash
├── registrar
│   ├── BaseRegistrar.sol
│   ├── BaseRegistrarImplementation.sol // Registrar NFT contract (one deployed for each domain name suffix)
│   ├── BulkRenewal.sol
│   ├── DummyOracle.sol
│   ├── RegistrarController.sol // Domain Ingress Controller Server
│   ├── RegistrarControllerV1.sol // back end minting contract
│   ├── IBatchRegistrarController.sol
│   ├── IRegistrarController.sol
│   ├── LinearPremiumPriceOracle.sol
│   ├── LogicControl.sol
│   ├── SafeMath.sol
│   ├── StableLogicControl.sol // Upgradable contract: responsible for defining prices, retaining domain name logic
│   ├── StringUtils.sol
│   ├── TestResolver.sol
│   ├── TokenURIBuilder.sol
│   ├── Whitelist.sol
│   ├── artifacts
│   └── mocks
├── readme.md
├── registry
│   ├── PNSRegistry.sol  // Registry Core Contract
│   ├── ReverseRegistrar.sol // The reverse registrar contract is responsible for the mapping of {{addr}}.addr.reserve => name
│   ├── PNS.sol // Registry core contract definition
│   └── artifacts
├── resolvers
│   ├── DefaultReverseResolver.sol // Reverse resolver contract, hosted by ReverseRegistrar
│   ├── IMulticallable.sol
│   ├── ISupportsInterface.sol
│   ├── Multicallable.sol
│   ├── OwnedResolver.sol
│   ├── PublicResolver.sol // Forward resolver contract, managed by the controller, responsible for name => address, custom key, contenthash and other content mapping
│   ├── Resolver.sol // parser definition
│   ├── ResolverBase.sol
│   ├── SupportsInterface.sol
│   ├── artifacts
│   └── profiles
└── root
    ├── Controllable.sol
    ├── Ownable.sol
    └── Root.sol // The root contract is the owner of the first-level domain name of reserve and each domain name suffix
```


