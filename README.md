**Hashed Confidential Docs Client API**

Enables the usage of the Hashed Confidential docs services by client applications.

To install the hashed private client api run the following command:

`npm i --save @smontero/hashed-confidential-docs`

Access to most of the functionality is done through the HashedConfidentailDocs object which enables its configuration and provides access to the dfferent API objects:

`import { HashedConfidentialDocs } from '@smontero/hashed-confidential-docs'`



A new instance of the [HashedConfidentialDocs](https://github.com/hashed-io/hashed-confidential-docs-client-api/blob/015b59837eb8c0117fecb0c6323053d605a6f5fd/src/HashedConfidentialDocs.js#L7) class has to be created passing in the 
ipfs url, hashed chain endpoint, appName and a faucet instance:

```
const hcd = new HashedConfidentialDocs({
    ipfsURL: 'https://ipfs.infura.io:5001',
    chainURI: 'ws://127.0.0.1:9944',
    appName: 'Confidential Docs',
    faucet
})
```

Then the user has to be logged in to hashed confidential docs:

`await hcd.login({
      ssoProvider: 'google',
      ssoUserId: 'ssoUserId',
      password: 'password'
    })`

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
const ownedData = await hcd.ownedData().viewByCID({cid})
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
const ownedData = await hcd.sharedData().viewByCID({cid})
```