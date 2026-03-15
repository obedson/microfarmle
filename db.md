| table_name           | column_name                 | data_type                   | is_nullable |
| -------------------- | --------------------------- | --------------------------- | ----------- |
| bookings             | id                          | uuid                        | NO          |
| bookings             | property_id                 | uuid                        | YES         |
| bookings             | farmer_id                   | uuid                        | YES         |
| bookings             | start_date                  | date                        | NO          |
| bookings             | end_date                    | date                        | NO          |
| bookings             | total_amount                | numeric                     | NO          |
| bookings             | status                      | character varying           | YES         |
| bookings             | payment_status              | character varying           | YES         |
| bookings             | created_at                  | timestamp with time zone    | YES         |
| bookings             | updated_at                  | timestamp with time zone    | YES         |
| bookings             | payment_reference           | text                        | YES         |
| bookings             | notes                       | text                        | YES         |
| bookings             | rejection_reason            | text                        | YES         |
| bookings             | deleted_at                  | timestamp with time zone    | YES         |
| bookings             | cancelled_by                | uuid                        | YES         |
| bookings             | cancelled_at                | timestamp with time zone    | YES         |
| bookings             | payment_retry_count         | integer                     | YES         |
| bookings             | payment_timeout_at          | timestamp with time zone    | YES         |
| courses              | id                          | uuid                        | NO          |
| courses              | title                       | text                        | NO          |
| courses              | description                 | text                        | NO          |
| courses              | content                     | text                        | NO          |
| courses              | duration                    | integer                     | NO          |
| courses              | level                       | text                        | YES         |
| courses              | category                    | text                        | NO          |
| courses              | created_at                  | timestamp without time zone | YES         |
| courses              | video_url                   | text                        | YES         |
| courses              | video_platform              | character varying           | YES         |
| farm_records         | id                          | uuid                        | NO          |
| farm_records         | farmer_id                   | uuid                        | NO          |
| farm_records         | property_id                 | uuid                        | YES         |
| farm_records         | livestock_type              | character varying           | NO          |
| farm_records         | livestock_count             | integer                     | NO          |
| farm_records         | feed_consumption            | numeric                     | NO          |
| farm_records         | mortality_count             | integer                     | NO          |
| farm_records         | expenses                    | numeric                     | NO          |
| farm_records         | expense_category            | character varying           | YES         |
| farm_records         | notes                       | text                        | YES         |
| farm_records         | record_date                 | date                        | NO          |
| farm_records         | created_at                  | timestamp with time zone    | YES         |
| farm_records         | updated_at                  | timestamp with time zone    | YES         |
| group_members        | id                          | uuid                        | NO          |
| group_members        | group_id                    | uuid                        | YES         |
| group_members        | user_id                     | uuid                        | YES         |
| group_members        | role                        | character varying           | YES         |
| group_members        | joined_at                   | timestamp with time zone    | YES         |
| group_members        | payment_status              | character varying           | YES         |
| group_members        | payment_reference           | character varying           | YES         |
| group_members        | amount_paid                 | numeric                     | YES         |
| group_members        | paid_at                     | timestamp without time zone | YES         |
| group_members        | member_status               | character varying           | YES         |
| group_members        | missed_payments_count       | integer                     | YES         |
| group_members        | total_contributions         | numeric                     | YES         |
| group_members        | last_payment_date           | timestamp without time zone | YES         |
| groups               | id                          | uuid                        | NO          |
| groups               | name                        | character varying           | NO          |
| groups               | description                 | text                        | YES         |
| groups               | category                    | character varying           | YES         |
| groups               | state                       | character varying           | YES         |
| groups               | location_lat                | numeric                     | YES         |
| groups               | location_lng                | numeric                     | YES         |
| groups               | creator_id                  | uuid                        | YES         |
| groups               | member_count                | integer                     | YES         |
| groups               | max_members                 | integer                     | YES         |
| groups               | is_active                   | boolean                     | YES         |
| groups               | image_url                   | text                        | YES         |
| groups               | created_at                  | timestamp with time zone    | YES         |
| groups               | updated_at                  | timestamp with time zone    | YES         |
| groups               | state_id                    | integer                     | YES         |
| groups               | lga_id                      | integer                     | YES         |
| groups               | entry_fee                   | numeric                     | YES         |
| groups               | contribution_enabled        | boolean                     | YES         |
| groups               | contribution_amount         | numeric                     | YES         |
| groups               | payment_day                 | integer                     | YES         |
| groups               | grace_period_days           | integer                     | YES         |
| groups               | late_penalty_amount         | numeric                     | YES         |
| groups               | late_penalty_type           | character varying           | YES         |
| groups               | auto_suspend_after          | integer                     | YES         |
| groups               | auto_expel_after            | integer                     | YES         |
| marketplace_products | id                          | uuid                        | NO          |
| marketplace_products | name                        | character varying           | NO          |
| marketplace_products | description                 | text                        | YES         |
| marketplace_products | price                       | numeric                     | NO          |
| marketplace_products | category                    | character varying           | YES         |
| marketplace_products | stock_quantity              | integer                     | YES         |
| marketplace_products | image_url                   | text                        | YES         |
| marketplace_products | supplier_id                 | uuid                        | YES         |
| marketplace_products | created_at                  | timestamp with time zone    | YES         |
| marketplace_products | updated_at                  | timestamp with time zone    | YES         |
| marketplace_products | unit                        | character varying           | YES         |
| marketplace_products | minimum_order               | integer                     | YES         |
| marketplace_products | location                    | character varying           | YES         |
| marketplace_products | images                      | jsonb                       | YES         |
| properties           | id                          | uuid                        | NO          |
| properties           | owner_id                    | uuid                        | YES         |
| properties           | title                       | character varying           | NO          |
| properties           | description                 | text                        | YES         |
| properties           | livestock_type              | character varying           | NO          |
| properties           | space_type                  | character varying           | NO          |
| properties           | size                        | numeric                     | NO          |
| properties           | size_unit                   | character varying           | NO          |
| properties           | city                        | character varying           | NO          |
| properties           | lga                         | character varying           | NO          |
| properties           | price_per_month             | numeric                     | NO          |
| properties           | available_from              | date                        | NO          |
| properties           | available_to                | date                        | NO          |
| properties           | amenities                   | ARRAY                       | YES         |
| properties           | images                      | ARRAY                       | YES         |
| properties           | is_active                   | boolean                     | YES         |
| properties           | created_at                  | timestamp with time zone    | YES         |
| properties           | updated_at                  | timestamp with time zone    | YES         |
| user_progress        | id                          | uuid                        | NO          |
| user_progress        | user_id                     | uuid                        | YES         |
| user_progress        | course_id                   | uuid                        | YES         |
| user_progress        | progress                    | integer                     | YES         |
| user_progress        | completed                   | boolean                     | YES         |
| user_progress        | completed_at                | timestamp without time zone | YES         |
| user_progress        | watch_time_seconds          | integer                     | YES         |
| user_progress        | last_watched_at             | timestamp without time zone | YES         |
| users                | id                          | uuid                        | NO          |
| users                | instance_id                 | uuid                        | YES         |
| users                | email                       | character varying           | NO          |
| users                | id                          | uuid                        | NO          |
| users                | aud                         | character varying           | YES         |
| users                | password                    | character varying           | NO          |
| users                | name                        | character varying           | NO          |
| users                | role                        | character varying           | YES         |
| users                | role                        | character varying           | NO          |
| users                | email                       | character varying           | YES         |
| users                | encrypted_password          | character varying           | YES         |
| users                | phone                       | character varying           | YES         |
| users                | email_confirmed_at          | timestamp with time zone    | YES         |
| users                | created_at                  | timestamp with time zone    | YES         |
| users                | invited_at                  | timestamp with time zone    | YES         |
| users                | updated_at                  | timestamp with time zone    | YES         |
| users                | reset_token                 | character varying           | YES         |
| users                | confirmation_token          | character varying           | YES         |
| users                | confirmation_sent_at        | timestamp with time zone    | YES         |
| users                | reset_token_expires         | timestamp with time zone    | YES         |
| users                | recovery_token              | character varying           | YES         |
| users                | referral_code               | character varying           | YES         |
| users                | recovery_sent_at            | timestamp with time zone    | YES         |
| users                | referred_by                 | uuid                        | YES         |
| users                | paid_referrals_count        | integer                     | YES         |
| users                | email_change_token_new      | character varying           | YES         |
| users                | email_change                | character varying           | YES         |
| users                | email_change_sent_at        | timestamp with time zone    | YES         |
| users                | last_sign_in_at             | timestamp with time zone    | YES         |
| users                | raw_app_meta_data           | jsonb                       | YES         |
| users                | raw_user_meta_data          | jsonb                       | YES         |
| users                | is_super_admin              | boolean                     | YES         |
| users                | created_at                  | timestamp with time zone    | YES         |
| users                | updated_at                  | timestamp with time zone    | YES         |
| users                | phone                       | text                        | YES         |
| users                | phone_confirmed_at          | timestamp with time zone    | YES         |
| users                | phone_change                | text                        | YES         |
| users                | phone_change_token          | character varying           | YES         |
| users                | phone_change_sent_at        | timestamp with time zone    | YES         |
| users                | confirmed_at                | timestamp with time zone    | YES         |
| users                | email_change_token_current  | character varying           | YES         |
| users                | email_change_confirm_status | smallint                    | YES         |
| users                | banned_until                | timestamp with time zone    | YES         |
| users                | reauthentication_token      | character varying           | YES         |
| users                | reauthentication_sent_at    | timestamp with time zone    | YES         |
| users                | is_sso_user                 | boolean                     | NO          |
| users                | deleted_at                  | timestamp with time zone    | YES         |
| users                | is_anonymous                | boolean                     | NO          |