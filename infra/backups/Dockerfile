FROM postgres:16-alpine

RUN apk add --no-cache bash tzdata gzip

COPY backup-postgres.sh /usr/local/bin/backup-postgres.sh
RUN chmod +x /usr/local/bin/backup-postgres.sh

CMD ["backup-postgres.sh"]
