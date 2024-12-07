# RSON - JSON with references

RSON is a superset of the JSON format. It extends JSON with the primary goal of allowing
references in the JSON itself.

In addition to that, RSON also allows:

- [x] Line comments
- [x] Block comments
- [x] Trailing commas

> These are just some niceties are not the primary goal of the RSON format.

## Usage

The RSON format allows references by adding 2 types of tokens:

1. DEF node - defines a `ref-name` for the value
2. REF node - references the given `ref-name`

The `DEF` node can be used on any JSON value. This node defines a name for the value which can then used
to refer to the same value.
The `REF` node can only appear as an _object value_ or an _array member_, and is used to refer to a
defined name.

Here is an example of how this would work:

```json
// team.rson

[
    {
        "members": [
            {
                "name": "Alice",
                "role": $ROLE_DEVELOPER
            },
            {
                "name": "Bob",
                "role": $ROLE_MANAGER
            },
            {
                "name": "Charlie",
                "role": $ROLE_DESIGNER
            },
            {
                "name": "David",
                "role": $ROLE_DEVELOPER
            }
        ],
        "roles": [
            {
                "name": "Developer"
            }(ROLE_DEVELOPER),
            {
                "name": "Designer"
            }(ROLE_DESIGNER),
            {
                "name": "Manager"
            }(ROLE_MANAGER)
        ]
    }
]
```

We can load the `teams.rson` file with the following code:

```javascript
require("rsonjs");

const teams = RSON.parse(fs.readFileSync("teams.rson", "utf-8"));

const role = teams.roles.find((role) => role.name === "Developer");
const members = teams.members.filter((member) => member.role === role); // <- Note we compare the role object

console.log(`Found ${members.length} members with role ${role.name}:`);
members.forEach((member, index) => {
  console.log(`\t${index}. ${member.name}`);
});
```

and a sample execution:

```
Which role to look for? developer
Found 2 members with role Developer:
        0. Alice
        1. David
```

## Specification

The `ref-name` must conform to the following regex:

```re
[A-Za-z_][A-Za-z_0-9]*
```

Or, in plain english:

> The first character must be a valid english letter or an underscore, and the
> following letters must be either an english letter, an underscore or a digit.
> A `ref-name` must have at least 1 character (the first character).

A `DEF` node can be used for every JSON value, so this makes the following
valid as well:

```json
{
    "organization": {
        "name": "Xpo Development"(ORG_NAME)
    },
    "title": $ORG_NAME
}
```

## Contributing

Feel free to open an issue or a PR.
