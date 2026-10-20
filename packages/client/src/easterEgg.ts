// Alien monster (small) from https://inkmeascii.com/ascii-art/alien-monster/, then RDCLSM.
const ART = String.raw`
             :----:  ----:
             :@--%-  %=-*+
    :+==+-  +=+  =+==*: -++-  -+==+:
    :%::*+--@:     ::     =#--+*::%:
    :#: ++--:             :---++ :#:
    :%: *=   -++-      -++-   =* :%:
    :*+-=+=: +@@+      =@@* :=+=-+*:
     :-*++*: -==-      :==- :*++*-:
        *=                    =*
        =====  +========+  =====
        ::-=#:-@:      :@-:#=-::
        ++-+#-=-:      :-=-#+-++
        ++-+*              *+-++
        :::::              :::::

 ____  ____   ____ _     ____  __  __
|  _ \|  _ \ / ___| |   / ___||  \/  |
| |_) | | | | |   | |   \___ \| |\/| |
|  _ <| |_| | |___| |___ ___) | |  | |
|_| \_\____/ \____|_____|____/|_|  |_|
`;

/** Greets whoever opens the browser console. */
export function greetConsole(): void {
  // As an argument, not the format string, so the art's % signs print as they are.
  console.log('%c%s', 'color: #a77bd8; font-family: monospace; line-height: 1.1', ART);
}
