console.log(`: <<'END'

‹ TERM GLOSSARY ›

1. git & GitHub

  1.1 Forking

    1.1.1 Creating the fork
    
    1.1.2 Comparing

      git fetch upstream                # récup upstream à jour
      git status                        # Affiche le diff avec upstream/master
      git log HEAD..upstream/master     # log les commits de upstream/master

    1.1.3 Updating

      git merge upstream/master         # récupère upstream/master dans origin/master
      git push origin master


END

`)
