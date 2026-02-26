.PHONY: nc-diag nc-fix

DOMAIN ?= graph-ranepa.ru
PROXY  ?=

## Nextcloud: run diagnostics (read-only)
nc-diag:
	sudo bash ops/nextcloud_diag.sh

## Nextcloud: fix untrusted domain
nc-fix:
	sudo bash ops/nextcloud_fix_untrusted_domain.sh \
		--domain $(DOMAIN) \
		$(if $(PROXY),--proxy $(PROXY))
