# Post en uitvoer controleren

**Programma:** EZ-MILL Express · **Onderdeel:** Posten via MILLPOSTEDITOR

## In het kort

De postprocessor zet je CAM-bewerkingen om naar machinecode. In jouw werkwijze open je MILLPOSTEDITOR vanuit EZ-MILL. Een aanpassing in de post werkt door voor volgende programma's.

## Stappen

1. Maak vóór een wijziging een kopie van de originele post.
2. Zoek de bestaande uitvoerregel in MILLPOSTEDITOR. Vertrouw alleen op de syntax en variabelen die in jouw postbestand staan.
3. Pas de post aan en sla een aparte testversie op.
4. Post een eenvoudig testprogramma en controleer de uitvoer in EZ-DNC.
5. Vergelijk de relevante regels met de bedoelde beweging en veilige posities.

## Veelgemaakte fout en controle

Een wijziging in de post kan alle programma's beïnvloeden. Test daarom eerst zonder werkstuk, met Z hoog en in enkelvoudige-regel-modus. Bij wijzigingen aan bewegingen of posities: controleer of coördinaten in werkstukcoördinaten (bijvoorbeeld G54) of machinecoördinaten (G53) staan.

Exacte menu's en postsyntax zijn afhankelijk van jouw bestanden; lever een screenshot of postfragment aan voor concrete instructies.
