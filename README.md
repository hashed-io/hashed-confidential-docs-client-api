**Hashed Confidential Docs Client API**

Enables the usage of the Hashed Confidential docs services by client applications.

To install the hashed private client api run the following command:

`npm i --save @smontero/hashed-confidential-docs`

Access to most of the functionality is done through the HashedConfidentailDocs object which enables its configuration and provides access to the different API objects:

`import { HashedConfidentialDocs } from '@smontero/hashed-confidential-docs'`



A new instance of the [HashedConfidentialDocs](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/HashedConfidentialDocs.js#L7) class has to be created passing in the 
ipfs url, ipfs auth header, [polkadot service class](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/f3a4bca9c3fe3201ebecc23985f4cf7fa78e8897/src/service/Polkadot.js#L13) instance and a faucet instance:

```
const hcd = new HashedConfidentialDocs({
    ipfsURL: 'https://ipfs.infura.io:5001',
    ipfsAuthHeader: `Basic ${Buffer.from(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`).toString('base64')}`,
    polkadot,
    faucet
  })
```

Then the user has to be logged in to hashed confidential docs, to login the user a VaultAuthProvider is required, the VaultAuthProvider used depends on how the user is login in to the system ex. username/password, google sign in or a native wallet, the current auth providers are:

- [PasswordVaultAuthProvider](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/f3a4bca9c3fe3201ebecc23985f4cf7fa78e8897/src/model/auth-providers/PasswordVaultAuthProvider.js#L8): for a user login in using username/password
- [GoogleVaultAuthProvider](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/f3a4bca9c3fe3201ebecc23985f4cf7fa78e8897/src/model/auth-providers/GoogleVaultAuthProvider.js#L11): for a user login in google sign in

`await hcd.login(vaultAuthProvider)`

**Its important to note that the polkadot service class instance passed in to the hashed confidential docs will be configured with a VaultWallet when the user is logged in, that will enable this instance to be used to call extrinsics and sign on behalf of the user.**

Once logged in the services provided by the [OwnedData](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/OwnedData.js#L5) and [SharedData](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/SharedData.js#L7) objects can be accessed.  

**OwnedData services**

* [add](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/OwnedData.js#L57): Store a payload(object or File) in the hashed private service

```
const ownedData = await hcd.ownedData().add({
    name: 'name1',
    description: 'desc1',
    payload: {
      prop1: 1,
      prop2: 'str1'
    }
  })
```


* [viewByCID](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/OwnedData.js#L105): View a stored payload by owned data cid, returns the deciphered payload(object or File)

```
const ownedData = await hcd.ownedData().viewByCID(cid)
```

**SharedData services**

* [share](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/SharedData.js#L63): Share the specified existing owned data record with another user

```
let sharedData = await hp.sharedData().share({
  toUserAddress: '5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua',
  name: 'name1',
  description: 'desc1',
  payload: {
    prop1: 1,
    prop2: 'str1'
  }
})
```

* [viewByCID](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/model/SharedData.js#L102): View a stored payload by shared data cid, returns the deciphered payload(object or File)

```
const ownedData = await hcd.sharedData().viewByCID(cid)
```