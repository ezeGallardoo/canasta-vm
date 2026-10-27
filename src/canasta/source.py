"""Verified SEPA source. Column names stay out until a real header is read."""

PRODUCER_DATASET = "https://datos.produccion.gob.ar/dataset/sepa-precios"
FRIDAY_ZIP_URL = (
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5"
    "/resource/91bc072a-4726-44a1-85ec-4a8467aad27e/download/sepa_viernes.zip"
)
# Content-Range total on 27 October 2026. The server answered 200 to a one-byte range.
FRIDAY_ZIP_BYTES = 322_799_761
