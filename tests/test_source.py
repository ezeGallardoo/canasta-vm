from canasta.source import FRIDAY_ZIP_BYTES, FRIDAY_ZIP_URL, PRODUCER_DATASET


def test_catalog_points_at_the_producer():
    assert PRODUCER_DATASET == "https://datos.produccion.gob.ar/dataset/sepa-precios"
    assert "datos.gob.ar" not in PRODUCER_DATASET
    assert FRIDAY_ZIP_URL.startswith("https://datos.produccion.gob.ar/")


def test_friday_archive_size_seen_on_27_october_2026():
    assert FRIDAY_ZIP_BYTES == 322_799_761
