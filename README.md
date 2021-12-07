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
Les tests ne passent qu'environnement local avec Ganache à cause de l'utilisation de fonctionnalité propres à Ganache sur la manipulation du timestamp de Block.

Voir : [https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5
](https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5)

`truffle test --network development`