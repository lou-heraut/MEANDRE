#!/usr/bin/python3
import sys
import logging
import os
from dotenv import load_dotenv

# The app lives next to this file, wherever the repository is cloned
APP_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(APP_DIR, ".env"))

logging.basicConfig(stream=sys.stderr)
sys.path.insert(0, APP_DIR)

from app import app as application
