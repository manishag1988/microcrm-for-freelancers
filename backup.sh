#!/bin/bash

# Micro-CRM Backup Script
# Run this script to create a backup of your application

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="micro-crm-backup-$TIMESTAMP"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Copy files to backup folder (excluding node_modules, .git, etc.)
rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.zip' --exclude='database.sqlite' --exclude='dist' . $BACKUP_DIR/$BACKUP_NAME/

# Compress the backup
cd $BACKUP_DIR
tar -czf "${BACKUP_NAME}.tar.gz" $BACKUP_NAME
rm -rf $BACKUP_NAME

echo "Backup created: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# Keep only last 5 backups
cd $BACKUP_DIR
ls -t *.tar.gz | tail -n +6 | xargs -r rm

echo "Backup complete! (Kept last 5 backups)"
