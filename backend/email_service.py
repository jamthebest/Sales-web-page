import os
import yagmail

def send_email(destinatary, subject, message):
    sender = os.environ['EMAIL_APP']
    app_password = os.environ['EMAIL_PASS']

    yag = yagmail.SMTP(sender, app_password)
    try:
        yag.send(destinatary, subject, message)
    except Exception as e:
        print(e)
        return False
    return True