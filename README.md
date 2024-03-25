# MapBan-R6
A simple MapBan bot for competitive Rainbow6 Siege that was written in 2019 for CCS Esports and then later modified to run on modern-day Discord (3/24/24)

## How to use
### Installing
1. Clone this repo and enter the directory where you saved it
2. Run `npm install`
3. Create a config based on the example provided
4. Run `node .`
5. Profit

### Config file
```json
{
    "prefix": "--", // Bot prefix
    "token": "", // Bot token
    "maps": [
        "CHALET",
        "KAFE",
        "COASTLINE",
        "OREGON", 
        "BANK", 
        "VILLA",
        "CLUBHOUSE"
    ], // Map Pool
    "log_channel": "CHANNEL_ID", // Where the MapBan results will be sent, meant to provide production teams with realtime info.
    "intents": ["allNonPrivileged"] // Discord intents
}
```

### Starting the Map Ban/Pick Flow
Command structure: `{prefix}open {order} "{role_name_1}" "{role_name_2}" "{optional_overtime_role_name_1,2]}"`

Example: `--open bbppbbd "Division 1" "Division 2" "Division 1"`

In above example, instead of randomly choosing a team to choose their attack/defend side using a coin flip during the decider map, the override allows a team to be given a choice to pick. If not specified, a random conflip wll decide who gets to pick first during the final phase.

#### order parameter
The order you want bans, picks, and the decider in. MapBan supports any order as long as `d` (decider) is at the end. For example, with seven maps in the map pool, `bbbbbbd` will make the flow ban six maps and choose the remaining.\
Want to ban four maps, pick two, and have a decider? `bbppbbd`. The flow is entirely customizable to fit any tournament type.

## Demo
![demo](https://i.imgur.com/dPVbSe2.gif)