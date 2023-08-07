### Pre-work

* Modify the domain name configuration of constant/index.js to the domain name information you want to deploy

``` js
{
    domainConfig: {
        baseNodeDomain: 'pop', // suffix
        name: 'popoo name service', // nft name
        symbol: 'PNS', // nft symbol
        basePrice: 10000 // wei
    }
}
```
### Develop Tips

```sh
npx hardhat compile
npx hardhat deploy 
npx hardhat test

OWNER_KEY={{account private key}}
DELETE deployment/goerli/.migrations.json

npx hardhat deploy --network bscTestnet 

FORCE=true OWNER_KEY={{account private key}} 

npx hardhat deploy --network bscTestnet (Forced to re-deploy)
```

If you only redeploy the js of a certain id, just remove the corresponding id from .migrations.json

If only a certain contract is redeployed, just empty the corresponding address from {{network}}_result.json

Below is the result of performing a local network deployment

```sh
npx hardhat deploy --network bscTestnet
```

```angular2html
deployer network= bscTestnet
deployer=0x2917115014beea46CA2d6aD3935c26C21439Fbc2, owner=0x2917115014beea46CA2d6aD3935c26C21439Fbc2

CORE STEP [1] -> [Deploy the core registry contract] --->  pnsAddress = deploy PNSRegistry()
deploying "PNSRegistry" (tx: 0x9d2d9988eb6b9de907d98b0748dc8618fc4247826a19d74c064d14b8ff9b91cf)...: deployed at 0x682f59762A3C8842c100fE1E41737e4C3F57cb96 with 742072 gas
pnsRegistryResult.address= 0x682f59762A3C8842c100fE1E41737e4C3F57cb96

CORE STEP [2] -> [Deploy the default reverse parser]  --->  defaultReverseResolverAddress = deploy DefaultReverseResolver(defaultReverseResolverResult.address)
deploying "DefaultReverseResolver" (tx: 0x8974a77c06525b6b8a8a79343f36f25664e25217b745cf09adc9b729f3a90e0e)...: deployed at 0x672a6998df275020bC863Ee3e98a1E44aF1a25AA with 414579 gas
defaultReverseResolverResult.address= 0x672a6998df275020bC863Ee3e98a1E44aF1a25AA

CORE STEP [3] -> [Deploy Reverse Registrar & Set Default Reverse Resolver] --->  reverseRegisterAddress = deploy ReverseRegistrar(pnsRegistryResult.address, defaultReverseResolverResult.address)
deploying "ReverseRegistrar" (tx: 0x4fb437e983e378de979d8a86ffca34db5190ff0ba7f2515ad64a41c2af0b16f6)...: deployed at 0xc99f3B3aE5C899218339d43b3616185Ae2961f15 with 1227816 gas
reverseRegistrarResult.address= 0xc99f3B3aE5C899218339d43b3616185Ae2961f15

CORE STEP [4] -> [Deploy the default forward public resolver] --->  publicResolverAddress = deploy PublicResolver(publicResolverResult.address)
deploying "PublicResolver" (tx: 0x0d2e38bcc5dee45baf0da0dc3d06aec90f25177dcc8fb8db407318cf7a37a007)...: deployed at 0x68Fe5dB8Dc2e9866F027AE46875C9d99Ab094A84 with 1978886 gas
publicResolverResult.address= 0x68Fe5dB8Dc2e9866F027AE46875C9d99Ab094A84
```

```js
deployResult = {
    "contracts/registry/PNSRegistry.sol": {
        "contentHash": "",
        "address": "0x682f59762A3C8842c100fE1E41737e4C3F57cb96",
        "args": []
    },
    "contracts/resolvers/DefaultReverseResolver.sol": {
        "contentHash": "",
        "address": "0x672a6998df275020bC863Ee3e98a1E44aF1a25AA",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96"
        ]
    },
    "contracts/registry/ReverseRegistrar.sol": {
        "contentHash": "",
        "address": "0xc99f3B3aE5C899218339d43b3616185Ae2961f15",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96",
            "0x672a6998df275020bC863Ee3e98a1E44aF1a25AA"
        ]
    },
    "contracts/resolvers/PublicResolver.sol": {
        "contentHash": "",
        "address": "0x68Fe5dB8Dc2e9866F027AE46875C9d99Ab094A84",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96"
        ]
    }
}
```

```angular2html
deployer network= bscTestnet

BASE STEP [1] -> [Deploy forward registrar contract] ---> 5 x baseRegistrarAddress = deploy BaseRegistrarImplementation(pnsAddress, baseNode) & baseRegistrarAddress.addController(owner, true)
pop  domain baseNode= 0x31712e8704e38b18f0689bccb4453e6f517d72e263f5dbf3511c6d361dc70468
deploying "BaseRegistrarImplementation" (tx: 0xc80fd9c2a9d99f6b2e72be070fd64d0c089b1880b77672d87728f2b47adc51ce)...: deployed at 0x9971a267793bB30AB1A46904bb7E389e5061209B with 2473749 gas
Domain: pop - baseRegistrarImplementationResult.address= 0x9971a267793bB30AB1A46904bb7E389e5061209B

BASE STEP [2] -> [Deploy TokenURL constructor contract] ---> pnsAddress = deploy TokenURIBuilder() and setTokenURIBuilder
deploying "TokenURIBuilder" (tx: 0x9bace4f085c820de6c3d3a6b6f3a91a5727f78185ecd2292bea0991f286d0455)...: deployed at 0x94aB996A29A9651C7A70F0879713BFBa46FF906e with 1182731 gas
Domain: pop - tokenURIBuilder.address= 0x94aB996A29A9651C7A70F0879713BFBa46FF906e
[Set the TokenURL contract to the basic registry contract] Domain: pop - Adding token uri builder to registrar (tx: 0x455f63513109861915b7a6d398d9b59416638f07bee2d617388b311c598273fb)...
deployer network= bscTestnet
```

```angular2html
ROOT STEP [1] -> [Deploy the root contract]  ---> rootAddress = deploy Root(pnsAddress) & pnsAddress.setOwner(ZERO_HASH, rootAddress) && rootAddress.setSubOwner(reserve.add, reverseRegisterAddress) & rootAddress.setSubOwner(pop, baseRegisterAddress)
deploying "Root" (tx: 0x5a6443009ee7bc3b42b163b44fe2cb38136ac9a38abd22aa98cd44c84a514f9d)...: deployed at 0x1C2793A26dD1F006640A7282a0b0e57BF1931655 with 561002 gas
rootResult.address= 0x1C2793A26dD1F006640A7282a0b0e57BF1931655

Setting final owner of root node on registry
[Set the root domain name owner to the root contract] Setting final owner of root node on registry (tx:0x8bd29a07e908748cb9bd1e41b9c5aebefdc3e79f3fe43e20ffb68ae6b04d0ad2)...

controller= false
Setting final owner as controller on root contract (tx: 0xbb1e921c18aafd4a8b9575bd7dc9ac31a15c829b04b370a69cb33b9d94aa5f4b)...

ROOT STEP [2] -> [Set the owner of the .pop first-level domain name to the forward registrar] ---> root.setSubnodeOwner(baseNodeDomain) & registrar.setResolver(publicResolver)
Domain: pop - Setting owner of eth node to registrar on root (tx: 0x495dd5d567804a47c6f96422073bd6639ce01286430fe88f37373700857f5a55)...
Domain: pop - Set publicResolver to registrar (tx: 0xe8a5fa3874955799005df450c7933703dc2f3772168c330d3619d959be61501e)...
Domain: pop - baseRegistrarImplementationContract.setResolver done

ROOT STEP [3] ---> setup reverse resolver
[Set the owner of the .reverse first-level domain name to the root contract] Setting owner of .reverse to owner on root (tx: 0x3f84a93052195ba7d1ec3331336ff94b90602f421d8b3040afb5c720b170e8d7)...
[Set the owner of the .addr.reverse secondary domain name to the reverse registrar contract] Setting owner of .addr.reverse to ReverseRegistrar on pnsRegistryContract (tx: 0xaca58b6242485ee90dcd52740ae4ab9da0868f945c14207e7d0fedd303825031)...
```

```js
deployResult = {
    "contracts/registry/PNSRegistry.sol": {
        "contentHash": "",
        "address": "0x682f59762A3C8842c100fE1E41737e4C3F57cb96",
        "args": []
    },
    "contracts/resolvers/DefaultReverseResolver.sol": {
        "contentHash": "",
        "address": "0x672a6998df275020bC863Ee3e98a1E44aF1a25AA",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96"
        ]
    },
    "contracts/registry/ReverseRegistrar.sol": {
        "contentHash": "",
        "address": "0xc99f3B3aE5C899218339d43b3616185Ae2961f15",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96",
            "0x672a6998df275020bC863Ee3e98a1E44aF1a25AA"
        ]
    },
    "contracts/resolvers/PublicResolver.sol": {
        "contentHash": "",
        "address": "0x68Fe5dB8Dc2e9866F027AE46875C9d99Ab094A84",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96"
        ]
    },
    "contracts/registrar/BaseRegistrarImplementation.sol": {
        "contentHash": "",
        "address": "0x9971a267793bB30AB1A46904bb7E389e5061209B",
        "args": [
            "Popoo Name Service",
            "PNS",
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96",
            "0x31712e8704e38b18f0689bccb4453e6f517d72e263f5dbf3511c6d361dc70468",
            "pop"
        ]
    },
    "contracts/registrar/TokenURIBuilder.sol": {
        "contentHash": "",
        "address": "0x94aB996A29A9651C7A70F0879713BFBa46FF906e",
        "args": [
            "0x9971a267793bB30AB1A46904bb7E389e5061209B"
        ]
    },
    "contracts/root/Root.sol": {
        "contentHash": "",
        "address": "0x1C2793A26dD1F006640A7282a0b0e57BF1931655",
        "args": [
            "0x682f59762A3C8842c100fE1E41737e4C3F57cb96"
        ]
    }
}
```

```angular2html
deployer network= bscTestnet

REGISTER STEP [1] -> [Deployment registration controller entry contract] ---> RegisterControllerAddress = deploy RegistrarController(baseRegisterAddress,StableLogicControlAddress, reverseRegistrarAddress, minCommitmentAge, maxCommitmentAge) && baseRegisterAddress.addController(controllerAddress,true), reverseRegisterAddress.setController(controllerAddress)
deploying "RegistrarController" (tx: 0xe0e4f6a612fcda9e736bbe63dca0dc4edfb158b77fab1a22593712a2f217a7c3)...: deployed at 0x6706bBf8a59bEcfa2A261327c182e6C7C0Db43ca with 1908036 gas
Domain: pop - Adding  controller as controller on registrar (tx: 0x2d0984ad613c0c4ca44a1c6b800085bdca6ad1c1ac6cc260ec2be0fcfd579e0d)...
ControllerAdded= true
```

### Register Domain

```sh
OWNKEY={{account private key}}
node ./scripts/ens.js
```