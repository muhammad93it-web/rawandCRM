#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
web_dist="$root/artifacts/rawand-decoration-crm/dist/public"
package_dir="$root/deploy/cpanel/package"

cd "$root"
PORT=20398 BASE_PATH=/ pnpm --filter @workspace/rawand-decoration-crm run build

rm -rf "$package_dir"
mkdir -p "$package_dir/public_html" "$package_dir/app" "$package_dir/config" "$package_dir/database"

cp -R "$web_dist"/. "$package_dir/public_html"/
cp -R "$root/deploy/cpanel/public"/. "$package_dir/public_html"/
cp -R "$root/deploy/cpanel/app"/. "$package_dir/app"/
cp -R "$root/deploy/cpanel/config"/. "$package_dir/config"/
cp -R "$root/deploy/cpanel/database"/. "$package_dir/database"/
cp "$root/deploy/cpanel/README.md" "$package_dir/README.md"

cat > "$package_dir/UPLOAD_LAYOUT.txt" <<'EOF'
Copy public_html/* to the domain's public_html directory.
Copy app/* and config/* to a directory beside public_html.
Import database/*.sql into the cPanel MariaDB database.
Copy config/config.example.php to config/config.php and fill in database values.
EOF

printf 'cPanel package created at %s\n' "$package_dir"