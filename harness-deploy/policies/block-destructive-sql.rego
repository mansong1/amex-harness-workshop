package db_sql

# Destructive statements are denied whenever this policy is evaluated.
# Attach the policy set only to the Schema Apply steps that should enforce it.
# (There is no working per-environment filter in this Rego surface today.)

rules := [
  {
    "types": ["mssql", "oracle", "postgres", "mysql"],
    "regex": [
      "drop\\s+table",
      "drop\\s+column",
      "drop\\s+database",
      "drop\\s+schema"
    ]
  },
  {
    "types": ["oracle"],
    "regex": ["drop\\s+catalog"]
  }
]

deny[msg] {
  some i, k, l
  rule := rules[i]
  regex.match(concat("", [".*", rule.regex[k], ".*"]), lower(input.sqlStatements[l]))
  msg := "dropping data is not permitted"
}
