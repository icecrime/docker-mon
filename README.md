**THIS IS A WIP**

## `dstats`
Docker stats dashboard for your terminal.

![woooo](ss.png)

```console
# run a container named `stress`
$ docker run --rm -it --name stress \
    jess/stress --cpu 1 --io 1 --vm 1 --vm-bytes 128M

# run a graph on that container
$ docker run -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    jess/dstats [CONTAINER_NAME]
```
