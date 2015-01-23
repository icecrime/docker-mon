**THIS IS A WIP**

## `dstats`
Docker stats dashboard for your terminal.

![woooo](http://s3.j3ss.co/screenshots/2015-01-23-01-04-36_2880x1800.png)

```console
# run a container named `stress`
$ docker run --rm -it --name stress \
    jess/stress --cpu 1 --io 1 --vm 1 --vm-bytes 128M

# run a graph on that container
$ docker run -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    jess/dstats [CONTAINER_NAME]
```
