#!/bin/bash
#sudo iptables -t nat -I OUTPUT -p tcp --dport 80 -j REDIRECT --to-ports 8080
#sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
sudo setcap 'cap_net_bind_service=+ep' /home/sygnal/.bun/bin/bun
/home/sygnal/.bun/bin/bun /home/sygnal/LochLock/server.ts
