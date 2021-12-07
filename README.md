# ⚡️ Défi : Staking

## Les spécifications fonctionnelles :
### Les spécifications fonctionnelles :
- Stake son token ERC20
- Unstake ses tokens
- Créer son propre token de récompense ou utiliser l’ETH ou un autre token ERC20 (Dai par exemple)
- La quantité de la récompense doit être proportionnelle à la valeur bloquées sur le smart contract

### Les exigences :

- Utilisation de l’oracle Chainlink

## Résultat

### Sur GitHub Pages

![](images/DeFiStaking.png)

### Tests
Tests are ONLY passing in Ganache environment, because of modifications of block timestamp in Ganache.
See : [https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5
](https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5)

`truffle test --network development`