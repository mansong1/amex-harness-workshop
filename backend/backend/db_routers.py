class MembersDbRouter:
    """Keep Django away from DB3.

    The `members` database is owned by Liquibase (Labs 6-9). Django only runs raw,
    read-only queries against it, so no model reads or writes go there and
    `migrate` never creates or alters anything in it.
    """

    MEMBERS = 'members'

    def db_for_read(self, model, **hints):
        return 'default'

    def db_for_write(self, model, **hints):
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == self.MEMBERS:
            return False
        return None
