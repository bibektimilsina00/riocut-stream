# Make Admin Script

This script allows you to promote a user to admin role in the Riocut application.

## Prerequisites

- Database must be running and accessible
- User must exist in the database (register through the app first)

## Usage

```bash
npm run make-admin <email>
```

## Example

```bash
npm run make-admin user@example.com
```

## What the script does

1. Looks up the user by email address
2. Displays current user details (role, status, etc.)
3. Updates the user's role to 'admin'
4. Ensures the admin user is active and not banned
5. Displays the updated user details

## Output Example

```
🔍 Looking for user with email: user@example.com...

📋 Current user details:
   ID: cm3abc123xyz
   Name: John Doe
   Email: user@example.com
   Role: user
   Active: true
   Banned: false

✅ Successfully updated user to admin!

📋 Updated user details:
   ID: cm3abc123xyz
   Name: John Doe
   Email: user@example.com
   Role: admin

🎉 Done!
```

## Error Handling

The script will fail with helpful messages if:
- No email is provided
- Email format is invalid
- User is not found in the database
- Database connection fails

## Notes

- If the user is already an admin, the script will inform you and exit without making changes
- When promoted to admin, the user is automatically set to active and unbanned
- The script uses Prisma Client directly for database access
