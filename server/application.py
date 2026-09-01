import os
import sys
from pathlib import Path

# Add project root directory to Python path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'whitehouse_core.settings')

import django
django.setup()

# Auto-run migrations and seeding on startup
try:
    from django.core.management import call_command
    call_command('migrate', interactive=False)
    call_command('seed_db', interactive=False)
    print('Database migrations and seeding verified successfully.')
except Exception as e:
    print('Startup database note:', e)

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
app = application
