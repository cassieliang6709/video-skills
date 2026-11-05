#!/bin/zsh
# tile stills of a chapter into 3x3 sheets
d=out/check/$1
ffmpeg -loglevel error -y -framerate 1 -i "$d/%02d.jpg" -vf "tile=3x3:padding=6:color=white" "$d/sheet_%d.jpg"
ls $d | grep sheet
