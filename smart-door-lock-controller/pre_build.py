import shutil
import os

if not os.path.exists('src/secrets.h'):
  print('prebuild: Copying secrets_default.h to secrets.h')
  shutil.copyfile('src/secrets_default.h', 'src/secrets.h')
